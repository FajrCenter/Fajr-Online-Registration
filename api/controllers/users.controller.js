import axios from "axios";
import bcrypt from "bcrypt";

/* Create Users Controller */

export async function CreateUser(req, res){

    try
    {
        const { username, firstName, lastName, email, password, gender } = req.body;

        const user_name = await GetUser("username", username);

        if(user_name){
            res.status(409).send({
                success: false,
                data: null,
                message: "Faild to Create Account, Username is Already Exists.",
            });
    
            return;
        }

        const user_mail = await GetUser("email", email);
    
        if(user_mail){
            res.status(409).send({
                success: false,
                data: null,
                message: "Faild to Create Account, E-Mail is Already Exists.",
            });
    
            return;
        }
    
        const createUserURL = `${process.env.END_POINT}/webservice/rest/server.php?wstoken=${process.env.TOKEN}&wsfunction=core_user_create_users&moodlewsrestformat=json&users[0][username]=${username}&users[0][password]=${password}&users[0][firstname]=${firstName}&users[0][lastname]=${lastName}&users[0][email]=${email}&users[0][country]=EN`;
    
        const response2 = await axios.post(createUserURL, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            }
        });
    
        if(!response2.data || response2.data.exception){
            res.status(400).send({
                success: false,
                data: null,
                message: "Invalid Data.",
            });
    
            return;
        }
    
        if(response2.data.length <= 0){
            res.status(409).send({
                success: false,
                data: null,
                message: "Faild to create Account, Try Again Later.",
            });
    
            return;
        }
    
        const enrollment = await EnrolUserHandler({courseID: 20, userID: response2.data[0].id, isStudent: true, gender,})
    
        res.status(enrollment.status).send(enrollment);
    }
    catch(error)
    {
        res.status(500).send({
            success: false,
            data: null,
            message: "Server Error, Try Again Later.",
        });
    }
}

/* ------------------------------ */

export async function GetCourses(req, res){

    let url = `${process.env.END_POINT}/webservice/rest/server.php?wstoken=${process.env.TOKEN}&wsfunction=core_course_get_courses&moodlewsrestformat=json`;

    for(let i = 2; i <= 100; i++){

        if(i === 68 || i === 82 || i === 97) continue;
        url += `&options[ids][${i - 2}]=${i}`;
    }

    const courses = await axios.get(url, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        }
    });

    if(!courses){

        res.status(500).send({
            success: false,
            data: null,
            message: "Faild to Get Courses.",
        });

        return;
    }

    if(courses.data.exception){
        res.status(400).send({
            success: false,
            data: null,
            message: `Faild to Get Courses, ${courses.data.exception.message}`,
        });

        return; 
    }

    res.status(200).send({
        success: true,
        data: courses.data,
        message: "",
    })
}

/* Get Course Groups Controller */

export async function C_GetCourseGroups(req, res){
    try
    {
        const { courseID } = req.body;

        const url = `${process.env.END_POINT}/webservice/rest/server.php?wstoken=${process.env.TOKEN}&wsfunction=core_group_get_course_groups&moodlewsrestformat=json&courseid=${courseID}`;
    
        const groups = await axios.post(url, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            }
        });
    
        if(!groups.data){

            res.status(500).send({
                success: false,
                status: 404,
                data: null,
                message: "Server Error, Try Again Later.",
            });

            return;
        }
    
        if(groups.data.exception){
            res.status(400).send({
                success: false,
                data: null,
                message: groups.data.message,
            });

            return;
        }
    
        if(groups.data.length <= 0){

            res.status(404).send({
                success: false,
                status: 404,
                data: null,
                message: "Groups Not Found.", 
            });

            return;
        }
        
        res.status(200).send({
            success: true,
            data: groups.data,
            message: "Success, Get Groups.", 
        });
    }
    catch(error)
    {
        console.log(error);
        res.status(500).send({
            success: false,
            data: res.data,
            message: "Server Error, Try Again Later.", 
        });
    }
}

/* ------------------------------ */

/* Enrol Users Controller */

export async function EnrolUser(req, res){

    try
    {
        const { email, courseID, groupID, job } = req.body;

        const user = await GetUser("email", email);
    
        if(!user){
            res.status(404).send({
                success: false,
                data: null,
                message: "Faild to Enrol User, User not Found",
            });
    
            return;
        }
    
        const url = `${process.env.END_POINT}/webservice/rest/server.php?wstoken=${process.env.TOKEN}&wsfunction=enrol_manual_enrol_users&moodlewsrestformat=json&enrolments[0][courseid]=${courseID}&enrolments[0][roleid]=${job ? 5 : 3}&enrolments[0][userid]=${user.id}`;

        const response = await axios.post(url, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            }
        });


        if(!response) {
            
            res.status(400).send({
                success: false,
                data: null,
                message: "Faild to Enrol User, Invalid Parameters."
            });
        }

        if(!response.data){

            const group = await SetUserGroup({
                userID: user.id,
                groupID,
            });

            if(!group.success){

                res.status(404).send({
                    success: false,
                    data: null,
                    message: group.message,
                });

                return;
            }

            res.status(200).send({
                success: true,
                data: null,
                message: group.message,
            });

            return;
        }

        if(response.data.exception) {

            res.status(400).send({
                success: false,
                data: null,
                message: `Faild to Enrol User, ${response.data.message}`,
            });
        }
    }
    catch(error)
    {
        res.status(500).send({
            success: false,
            data: null,
            message: "Server Error, Try Again Later.",
        });
    }
}

/* ------------------------------ */

/* Get User Handler */

async function GetUser(key, value){

    try
    {
        const url = `${process.env.END_POINT}/webservice/rest/server.php?wstoken=${process.env.TOKEN}&wsfunction=core_user_get_users&moodlewsrestformat=json&criteria[0][key]=${key}&criteria[0][value]=${value}`;

        const res = await axios.get(url, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            }
        });
        

        if(!res.data || res.data.exception) return null;

        if(res.data.users.length <= 0) return null;

        return res.data.users[0];
    }
    catch(error)
    {
        throw error;
    }
}

/* ------------------------------ */

/* Enrol Users Handler */

async function EnrolUserHandler(data){

    try
    {
        const { courseID, userID, isStudent, gender } = data;

        const url = `${process.env.END_POINT}/webservice/rest/server.php?wstoken=${process.env.TOKEN}&wsfunction=enrol_manual_enrol_users&moodlewsrestformat=json&enrolments[0][courseid]=${courseID}&enrolments[0][roleid]=${isStudent ? 5 : 3}&enrolments[0][userid]=${userID}`;

        const response = await axios.post(url, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            }
        });


        if(!response) return {
            success: false,
            status: 403,
            data: null,
            message: "Faild Enrol User.",
        }

        if(!response.data) return await GetCourseGroupsHandler({
            courseID,
            userID,
            gender,
        });

        if(response.data.exception) return {
            success: false,
            status: 409,
            data: null,
            message: response.data.message,
        }
    }
    catch(error)
    {
        throw error;
    }
}

async function GetCourseGroupsHandler(data){

    try
    {
        const { courseID, userID, gender } = data;

        const url = `${process.env.END_POINT}/webservice/rest/server.php?wstoken=${process.env.TOKEN}&wsfunction=core_group_get_course_groups&moodlewsrestformat=json&courseid=${courseID}`;
    
        const res = await axios.post(url, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            }
        });
    
        if(!res.data) return {
            success: false,
            status: 404,
            data: null,
            message: "Faild to Create and Enrol User.",
        }
    
        if(res.data.exception) return {
            success: false,
            status: 409,
            data: null,
            message: res.data.message,
        }
    
        if(res.data.length <= 0) return {
            success: false,
            status: 404,
            data: null,
            message: "Faild to Create and Enrol User.", 
        }

        return await SetUserGroup({
            groupID: res.data[gender].id,
            userID,
        });
    }
    catch(error)
    {
        throw error;
    }
}

async function SetUserGroup(data){

    try
    {
        const { groupID, userID } = data;

        const url = `${process.env.END_POINT}/webservice/rest/server.php?wstoken=${process.env.TOKEN}&wsfunction=core_group_add_group_members&moodlewsrestformat=json&members[0][groupid]=${groupID}&members[0][userid]=${userID}`;
    
        const response = await axios.post(url, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            }
        });
    
        if(!response.data) return {
            success: true,
            status: 200,
            data: response.data,
            message: "Enrol User Completed Successfully.", 
        }
    
        if(response.data.exception) return {
            success: false,
            status: 409,
            data: null,
            message: response.data.message,
        }
    }
    catch(error)
    {
        throw error;
    }
}

/* ------------------------------ */

/* Admin LogIn Controller */

export async function Admin_LogIn(req, res){

    try
    {
        const { username, password } = req.body;

        if(username !== process.env.ADMIN_USER){
            res.status(401).send({
                success: false,
                data: null,
                message: "Unauthorize, Username, or password is Wrong",
            });
    
            return;
        }
    
        if(password !== process.env.ADMIN_PASSWORD){
            res.status(401).send({
                success: false,
                data: null,
                message: "Unauthorize, Username, or password is Wrong",
            });
    
            return;
        }
    
        res.cookie("hasauthorized", "true", { maxAge: 604800000 });
        res.status(200).send({
            success: true,
            data: null,
            message: "Authorize",
        });
    }
    catch(error)
    {
        throw error;
    }
}

/* ------------------------------ */