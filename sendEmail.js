

import nodemailer from "nodemailer";

export function sendResetLink(email,subject,content){
    console.log(email,content)
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL,
          pass: process.env.PASSWORD
        }
      });
      
      var mailOptions = {
        from: process.env.GMAIL,
        to: email,
        subject:subject,
        // text: `To reset your password, Please click on this link: http://localhost:3000/reset/${token}`,
        html:content
    };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}

