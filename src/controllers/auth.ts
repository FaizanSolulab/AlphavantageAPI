import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user";
import Otp from "../models/otp";
import { Twilio } from "twilio";
import logger from "../config/logger";
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()

interface CustomRequest extends express.Request {
  user?: any;
}

const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const registerUser = async (req: CustomRequest, res: any) => {
  logger.info("inside controllers/auth.ts /registerUser");

  try {
    
    const { phoneNumber, password, channel, email } = req.body;

    if(!channel){
        logger.error("Please enter the channel you wish to receive OTP on");
        return res.status(400).send({ error: "Please enter the channel you wish to receive OTP on" });
    }

    if(channel == "sms"){

        if (!phoneNumber) {
          logger.error("Phone number field is mandatory in case the channel is sms");
          return res.status(400).send({ error: "Phone number field is mandatory in case the channel is sms" });
        }
        if (!password ) {
          logger.error("Cannot proceed without entering the password");
          return res.status(400).send({ error: "Cannot proceed without entering the password" });
        }
    

        logger.info("Inside sms channel of register user")

        if(phoneNumber.length !== 10){
            logger.error("Invalid Phone Number")
            res.status(400).json({error:'Invalid Phone Number'})
        }
        let user = await User.findOne({ phoneNumber });
        if (user) {
          logger.error("Phone number already taken");
          return res
            .status(400)
            .json({ error: "User with this phone number already exists" });
        }
    
        const hashedPassword = await bcrypt.hash(password, 10);
        logger.info(
          `Password hashed successfully for user with phone number: ${phoneNumber}`
        );
    
        user = await User.create({
          phoneNumber,
          password: hashedPassword,
        });
        if (!user) {
          logger.error('Error in User.create()');
          return res.status(400).json({ error: "User registration failed" });
        }
    
        logger.info(`User successfully created with id: ${user.id}`);
    
    
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        await Otp.create({ phone: phoneNumber, code: otpCode });
        // console.log("otp", otp)
        const phoneNumberWithPlus = "+91" + phoneNumber;
        await twilioClient.messages.create({
          body: `Your OTP code is ${otpCode}`,
          from: "+15074486411",
          to: phoneNumberWithPlus,
        });
        logger.info("Sending OTP");
    
        // Return the access token to the client
        res.status(201).json({
            id: user.id,
          phoneNumber,
          otpRequested: true,
          verified: false,
        });
    }

    if(channel == "email"){

      if (!email) {
        logger.error("Email field is mandatory in case the channel is email");
        return res.status(400).send({ error: "Email field is mandatory in case the channel is email" });
      }
      if (!password ) {
        logger.error("Cannot proceed without entering the password");
        return res.status(400).send({ error: "Cannot proceed without entering the password" });
      }

    logger.info("Inside email channel of register user")
        function isValidEmail(email: string): boolean {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(email);
          }
          const isValid = isValidEmail(email);
          console.log(isValid); 

          if(!isValid){
            logger.error('Email is not valid one')
            res.status(400).json({error:'Invalid Email'})
          }

          const user = await User.findOne({ email });
        if (user) {
          logger.error("Email already taken");
          return res
            .status(400)
            .json({ error: "User with this email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        logger.info(
          `Password hashed successfully for user with email: ${email}`
        );

        console.log("hashedPassword", hashedPassword)

         const userCreate = await User.create({
            phoneNumber: phoneNumber,
            email: email,
            password: hashedPassword,
            channel:email
          });
          console.log("userCreate", userCreate)

          if (!userCreate) {
            logger.error(`Error in User.create(), error`);
            return res.status(400).json({ error: "User registration failed" });
          }
      
          logger.info(`User successfully created with id: ${userCreate.id}`);
        
        //sending otp on mail
        const sendEmail = async () => {

            logger.info("inside sendEmail")
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            await Otp.create({ eemail: email, code: otpCode });

            const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'faizanmansuri316@gmail.com',
              pass: 'eejevistvviuzqjn'
            }
          });
      
          const mailOptions= {
            from:'faizanmansuri316@gmailcom',
            to: email,
            subject:"Verify OTP",
            text: `Your OTP code is ${otpCode}`
          };
      
          transporter.sendMail(mailOptions, function(error, info){
            if(error){
              console.log(error);
            } else{
              logger.info("Email Sent", + info.response);
            }
          });
      
        }
        await sendEmail();

        res.status(201).json({
            id: userCreate.id,
          phoneNumber,
          otpRequested: true,
          verified: false,
        });
    }

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const verifyOtp = async (req: CustomRequest, res: any) => {
  logger.info("inside controllers/auth.ts /verifyOtp");
  try {
    const { otp } = req.body;
    const {phoneNumber, email} = req.query;

    if(req.query.phoneNumber){

        logger.info("Inside sms channel of verifyOTP")
        if (!otp) {
          logger.error("Please enter OTP first");
          res.status(400).send({ error: "Please enter OTP first" });
        }
    
          const otpData = await Otp.findOne({phone:phoneNumber});
              
          if (!otpData || otp !== otpData.code) {
            logger.error("OTP not found");
            return res.status(404).json({ error: "OTP not found" });
          }
    
        //   const otpIsValid = await bcrypt.compare(otp, otpData.code);
    
        //   if(!otpIsValid){
        //     logger.error("Invalid OTP");
        //     res.status(400).json({error: "Invalid OTP"});
        //   }
    
        logger.info("Otp successfully verified")
          // Update user's verified status to true
          const updatedUser = await User.updateOne({ phoneNumber }, { verified: true });
          
          if(!updatedUser){
              logger.error(`User not found with phone number: ${phoneNumber}`);
              res.status(404).json({error: "User not found"});
            }
            
            const user = await User.findOne({ phoneNumber });
    
          // Delete the OTP data
          await Otp.deleteOne({ phone: phoneNumber });
    
          const accessToken = jwt.sign(
            {
                id: user?._id,
                phoneNumber: user?.phoneNumber,
                password: user?.password,
                verified: true
            },
            process.env.ACCESS_TOKEN_SECRET || "",
            {
                expiresIn: "24h",
            }
          );
    
    
    
          return res.status(200).json({ accessToken, user });
        
    }

    if(req.query.email){
        logger.info("Inside email channel of verifyOTP")
        if (!otp) {
          logger.error("Please enter OTP first");
          res.status(400).send({ error: "Please enter OTP first" });
        }

         const otpData = await Otp.findOne({eemail:email});
         if (!otpData || otp !== otpData.code) {
            logger.error("OTP not found");
            return res.status(404).json({ error: "OTP not found" });
          }

          logger.info("Otp has been successfully verified")

          const updatedUser  = await User.updateOne({ email }, { verified: true });
          
          
          if(!updatedUser ){
              logger.error(`User not found with email: ${email}`);
              res.status(404).json({error: "User not found"});
            }
            
            const user = await User.findOne({email});
    

          // Delete the OTP data
          await Otp.deleteOne({ eemail: email });

          const accessToken = jwt.sign(
            {
                id: user?._id,
                email: user?.email,
                password: user?.password,
                verified: true
            },
            process.env.ACCESS_TOKEN_SECRET || "",
            {
                expiresIn: "24h",
            }
          );
    
    
    
          return res.status(200).json({ accessToken, user });
    }

    
  } catch (error) {
    logger.error("Error occured in controllers/auth.ts /verify-otp", error);
    res.status(500).json({ error: "Server error" });
  }
};
