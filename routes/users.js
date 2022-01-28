import express, { request, response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { getAllUsers,genPassword ,validatePassword,validateemail,getuserbyemail,adduser,
            getAllRequests,addRequest,getrequestbyemail,getrequestbytoken,
             updateuser,deleteRequest, addTempUser,getTempUserByEmail,deleteTempUser} from "../helper.js";
import { sendResetLink } from "../sendEmail.js";
import { auth } from "../middleware/auth.js";


const router = express.Router();


router.get("/",auth,async(request,response)=>{
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
                //console.log(newuser)
                // let result = await adduser(newuser) //adding new user
                // response.status(200).send(result);
                let result = await addTempUser(newuser);
                sendResetLink(newuser.email,`
                <h3>Account confirmation email</h3>
                <div>To reset your password, Please click <a href=http://localhost:3000/confirmation/${newuser.email}>here</a></div>
                `)
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
    let user = request.body;
    let userfromdb= await getTempUserByEmail(user.email)
    console.log(user,userfromdb);
    let result = await adduser(userfromdb);
    await deleteTempUser(user.email)
    result.send(result);
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
            sendResetLink(requestfromdb.email,requestfromdb.token);
        }
        else{
            const token = jwt.sign({id:userfromdb._id},process.env.SECRET_KEY);
        //console.log(token);
        const newrequest = {
            token,
            email:user.email
        }
        addRequest(newrequest);
        sendResetLink(user.email,`
        <h3>Password Reset Instructions</h3>
        <div>To reset your password, Please click <a href=http://localhost:3000/reset/${token}>here</a></div>
        <div><small>Kindly check in spam folder also.</small></div>
        `);
        }
        response.status(200).send({message:"Check your email for further instructions"});
    }else{
        response.status(400).send({message:"No such user. Kindly check again"});
    }
    
})


router.put("/reset",async (request,response)=>{
    //has token,password
    let user = request.body;
    //console.log(user);
    let requestfromdb = await getrequestbytoken(user.token)
   //console.log("tocheck",requestfromdb);

  if(requestfromdb){
   let result = await updateuser(requestfromdb.email,await genPassword(user.password));
   //console.log(result)
        if(result){
               await deleteRequest(user.token);
            }  
   response.send(result);
}  else{
      response.status(404).send({message:"Invalid request"})
  }
})

export const usersRouter = router;