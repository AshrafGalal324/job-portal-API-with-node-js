import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
//import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

//export const register = async (req, res) => {
   // try {
       // const { fullname, email, phoneNumber, password, role } = req.body;
         
      //  if (!fullname || !email || !phoneNumber || !password || !role) {
       //     return res.status(400).json({
           //     message: "Something is missing",
           //     success: false
          //  });
       // };
        //const file = req.file;
        //const fileUri = getDataUri(file);
        //const cloudResponse = await cloudinary.uploader.upload(fileUri.content);

       // const user = await User.findOne({ email });
       // if (user) {
       //     return res.status(400).json({
       //         message: 'User already exist with this email.',
       //         success: false,
       //     })
//}
        //const hashedPassword = await bcrypt.hash(password, 10);

       // await User.create({
           // fullname,
          //  email,
         //   phoneNumber,
         //   password: hashedPassword,
          //  role,
            //profile:{
                //profilePhoto:cloudResponse.secure_url,
           // }
      //  });

        //return res.status(201).json({
         //   message: "Account created successfully.",
          //  success: true
        //});
       // res.status(201).json({
       //     message: "User registered successfully",
       //     user: {
       //       id: User._id,
        //      fullname: User.fullname,
        //      email: User.email,
        //      phoneNumber: User.phoneNumber,
         //     password: User.password,
          //    role: User.role,
              
      
      
      
          //  },
       // })
  //  } catch (error) {
  //      console.log(error);
   //     console.log("gbdgggb");
  //  }

//_________________________________________________________________________
export const register = async (req, res) => {
const{fullname,phoneNumber,email,password,role}=req.body;

const oldUser=await User.findOne({email:email});

if(oldUser){
    const error=appError.create('email already exist',400,httpStatus.FAIL);
return next(error);
}
//hashing password

const hashedPassword=await bcrypt.hash(password,10);//10 this the time complexity for the hashing password
const newuser=new User({

    fullname,
    phoneNumber,
    email,
    password:hashedPassword,
    role,
   
})
//generate jwt token
//to generate 32 random char use in cmd:require('crypto').randomBytes(32).toString('hex');
//_______________________________________________________
const token=await jwt.sign({email:newuser.email,id:newuser._id,role:newuser.role},process.env.SECRET_KEY,{expiresIn:'1m'});
//from image in mobile
newuser.token=token;

//and token use to speak with other API
//_______________________________________________________


await newuser.save();
res.status(201).json({data:{User:newuser}})



}
export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            })
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            })
        };
        // check role is correct or not
        if (role !== user.role) {
            return res.status(400).json({
                message: "Account doesn't exist with current role.",
                success: false
            })
        };

        const tokenData = {
            userId: user._id
        }
        const token = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200).cookie("token", token, { maxAge: 1 * 24 * 60 * 60 * 1000, httpsOnly: true, sameSite: 'strict' }).json({
            message: `Welcome back ${user.fullname}`,
            user,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}
export const logout = async (req, res) => {
    try {
        return res.status(200).cookie("token", "", { maxAge: 0 }).json({
            message: "Logged out successfully.",
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}
export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, bio, skills } = req.body;
        
        const file = req.file;
        // cloudinary ayega idhar
        const fileUri = getDataUri(file);
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content);



        let skillsArray;
        if(skills){
            skillsArray = skills.split(",");
        }
        const userId = req.id; // middleware authentication
        let user = await User.findById(userId);

        if (!user) {
            return res.status(400).json({
                message: "User not found.",
                success: false
            })
        }
        // updating data
        if(fullname) user.fullname = fullname
        if(email) user.email = email
        if(phoneNumber)  user.phoneNumber = phoneNumber
        if(bio) user.profile.bio = bio
        if(skills) user.profile.skills = skillsArray
      
        // resume comes later here...
        if(cloudResponse){
            user.profile.resume = cloudResponse.secure_url // save the cloudinary url
            user.profile.resumeOriginalName = file.originalname // Save the original file name
        }


        await user.save();

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200).json({
            message:"Profile updated successfully.",
            user,
            success:true
        })
    } catch (error) {
        console.log(error);
    }
}