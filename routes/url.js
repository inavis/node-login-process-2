import express, { request, response } from "express";
import {  getShortUrl ,getLongUrl,getAllUrl,addUrl, getLongUrlfromDb} from "../helper.js";
import shorten from 'simple-short';
import { auth } from "../middleware/auth.js";

const router = express.Router();

//get all urls if we have token
router.get("/",auth,async(request,response)=>{
    let result = await getAllUrl();
    response.send(result);
})

//shorten url to get a id
router.post("/shorturl",async(request,response)=>{
    let longurl  = request.body.longurl;
    let result = await getShortUrl(longurl);
    response.send({"short_url":result});
})
//from id get actual url
router.post("/longurl",async(request,response)=>{
    let sid  = request.body.sid;
    let result = await getLongUrlfromDb(sid);
    response.send({"long-url":result});
})

router.post("/add",async(request,response)=>{
    let urldata = request.body;
    let result = await addUrl(urldata)
    response.send(result);
})

export const urlRouter = router;