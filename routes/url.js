import express, { request, response } from "express";
import {  getShortUrl ,getLongUrl,getAllUrl} from "../helper.js";

const router = express.Router();

router.get("/",async(request,response)=>{
    let result = await getAllUrl();
    response.send(result);
})

//shorten url to get a id
router.post("/shorturl",async(request,response)=>{
    let longurl  = request.body.longurl;
    let result = await getShortUrl(longurl);
    response.send({"short-url":result});
})
//from id get actual url
router.post("/longurl",async(request,response)=>{
    let sid  = request.body.sid;
    let result = await getLongUrl(sid);
    response.send({"long-url":result});
})



export const urlRouter = router;