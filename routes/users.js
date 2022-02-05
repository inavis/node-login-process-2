import express, { request, response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { getAllUsers,genPassword ,validatePassword,validateemail,getuserbyemail,adduser,
            getAllRequests,addRequest,getrequestbyemail,getrequestbytoken,
             updateuser,deleteRequest, addTempUser,getTempUserByEmail,deleteTempUser,
            getShortUrl,getLongUrl,addUrl,getLongUrlfromDb} from "../helper.js";
import { sendResetLink } from "../sendEmail.js";
import { auth } from "../middleware/auth.js";


const router = express.Router();


router.get("/",async(request,response)=>{
    let result = await getAllUsers();
    response.send(result);
})

router.get("/requests",async(request,response)=>{
    const result =await getAllRequests();
    response.send(result);
})


router.post("/signup", async (request, response) => {
    let newuser = request.body;
    // console.log("validate email" ,validateemail(newuser.email))
    // console.log("email check",await getuserbyemail(newuser.email))


    //check if username is in email format
    if(validateemail(newuser.email)){
         //check if user already exists with emailid
        if(await getuserbyemail(newuser.email) !==null){
            response.status(404).send({message:"User with email already exist"})
        }else{
            if(validatePassword(newuser.password)){
                newuser.password = await genPassword(newuser.password) //hashing password

                //checking if confirmation email already sent so that duplicate entries are avoided
                let userfromdb= await getTempUserByEmail(newuser.email)
                if(userfromdb){
                    response.send({message:"Mail has been sent already.Kindly check in spam folder also"})
                }else{
                    let result = await addTempUser(newuser);

                    //getting sid from long url
                    const sid = await getShortUrl(`http://localhost:3000/confirmation/${newuser.email}`)
                    console.log("sid",sid);

                    // new Date object
                    const currentdate = new Date(); 
                        const datetime = ((currentdate.getMonth()+1) + "/"
                        + currentdate.getDate()  + "/" 
                        + currentdate.getFullYear())
                        // + " "  
                        // + currentdate.getHours() + ":"  
                        // + currentdate.getMinutes() + ":" 
                        // + currentdate.getSeconds());     

                    //adding long and short url to collection urls 
                    await addUrl({"date":datetime,longurl:`https://url-shortener-1.netlify.app/confirmation/${newuser.email}`,shorturl:`http://localhost:3000/confirmation/${sid}`});
                    
                     //sending confirmation email
                    sendResetLink(newuser.email,"Account Confirmation- URL shortener website",`
                    <h3>Account confirmation email</h3>
                    <div>To reset your password, Please click <a href=http://localhost:3000/confirmation/${sid}>here</a></div>
                    `);
                    response.send({message:"Kindly confirm the email.Kindly check in spam folder also"})
                }
                
            }else{
                response.status(404).send({message:"Password validation failed"})
            }
        }
    }else{
        response.status(404).send({message:"Enter a valid email id"})
    }
   
    // console.log(newuser.password,genPassword(newuser.password));
    
    
});

router.post("/confirm",async (request,response)=>{

    //getting long url from url collection
    let user = request.body;
    let urls = await getLongUrlfromDb(user.url)
    const longurl = (urls.longurl)
    //getting email
    const email = longurl.split("confirmation/")[1];
    console.log("longurl",longurl)
    console.log("email",email);

    
    // checking if it is valid temp user
    let userfromdb= await getTempUserByEmail(email)
    console.log(user,userfromdb);
    if(userfromdb){
        //Once confirmed user added to users2 collection from tempUser
        let result = await adduser(userfromdb);
        //delete user from tempUser
        await deleteTempUser(email)
        response.send(result);
    }else{
        //checking is user is already a confirmed user
        const confirmuser = await getuserbyemail(email);
        if(confirmuser){
            response.send({message:"Already existing user so kindly try to Login"})
        }else{
            response.send({message:"Some error occured. Try registering account again"})
        }
        
    }
    
})





router.post("/login", async (request, response) => {
    let user = request.body;
    //console.log(user);
    let userfromdb = await getuserbyemail(user.email)
    //console.log(userfromdb)

    if(!userfromdb){
        response.status(400).send({message:"Invalid credentials"})
        return
    }

    const isPasswordmatch = await bcrypt.compare(user.password,userfromdb.password)
    //console.log(isPasswordmatch);

    if(isPasswordmatch){
        const token = jwt.sign({id:userfromdb._id},process.env.SECRET_KEY);
        //console.log(token)
        response.send({message:"successful login",token:token})
    }else{
        response.status(400).send({message:"Invalid credentials"})
    }
});

router.post("/forgot-password",async (request,response)=>{
    let user = request.body;
    //console.log(user);
    let userfromdb = await getuserbyemail(user.email)
    //console.log(userfromdb);

    if(userfromdb){
        //checking if already a request has been sent recently and using the same link
        let requestfromdb = await getrequestbyemail(user.email);
        //console.log(requestfromdb);

        if(requestfromdb){
            response.send({message:"Email already sent. Kindly check in spam folder also"})
        }
        else{
            const token = jwt.sign({id:userfromdb._id},process.env.SECRET_KEY);
        //console.log(token);
        const newrequest = {
            token,
            email:user.email
        }
        //adding reuqest to track it.
        await addRequest(newrequest);

        //getting sid from longurl
        const sid = await getShortUrl(`http://localhost:3000/reset/${token}`)
        console.log("sid",sid);

        // new Date object
        const currentdate = new Date(); 
        const datetime = ( (currentdate.getMonth()+1)  + "/"
        + currentdate.getDate() + "/" 
        + currentdate.getFullYear() )
        // + " "  
        // + currentdate.getHours() + ":"  
        // + currentdate.getMinutes() + ":" 
        // + currentdate.getSeconds()); 

        //adding longurl and shorturl to urls collection
        await addUrl({"date":datetime,longurl:`http://localhost:3000/reset/${token}`,shorturl:`http://localhost:3000/reset/${sid}`});
        
        //sending email with link to reset password
        sendResetLink(user.email,"Password Reset-URL shortener",`
        <h3>Password Reset Instructions</h3>
        <div>To reset your password, Please click <a href=https://url-shortener-1.netlify.app/reset/${sid}>here</a></div>
        <div><small>Kindly check in spam folder also.</small></div>
        `);
        }
        response.status(200).send({message:"Check your email for further instructions"});
    }else{
        response.status(400).send({message:"No such user. Kindly check again"});
    }
    
})


router.put("/reset",async (request,response)=>{
    
    //getting sid from) user
    let user = request.body;

    //getting longurl from sid and token from longurl
    let urls = await getLongUrlfromDb(user.url)
    const longurl = (urls.longurl)
    let token = longurl.split("reset/")[1];
    console.log("longurl",longurl)
    console.log("token",token);


    //checking if it is valid request
    let requestfromdb = await getrequestbytoken(token)
   console.log("tocheck",requestfromdb);

   //if valid then update password
  if(requestfromdb){
   let result = await updateuser(requestfromdb.email,await genPassword(user.password));
   //console.log(result)
        //if password updated then delete the requests
        if(result){
               await deleteRequest(token);
            }  
   response.send(result);
}  else{
      response.status(404).send({message:"Invalid request"})
  }
})

export const usersRouter = router;