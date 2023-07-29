import { Request } from "./ajaxreq.js";

const coursesSelector = document.getElementById("courses");
const groupsSelector = document.getElementById("groups");
const email = document.getElementById("email");
const submitBTN = document.getElementById("submit-btn");

const alert = document.getElementById("main-alert");

let canSubmit = true;

Init();

async function Init(){

    const courses = await GetCourses();

    if(!courses){

        interactable();

        return;
    }

    for(let i = 0; i < courses.length; i++){
        coursesSelector.innerHTML += `<option value=${courses[i].id}>${courses[i].shortname}</option>`;
    }

    interactable();
}

coursesSelector.onchange = async function(){

    RemoveAlert();

    interactable(false);

    const groups = await GetGroups(this.value);

    if(!groups){

        interactable();

        return;
    }

    groupsSelector.innerHTML = "";

    for(let i = 0; i < groups.length; i++){
        groupsSelector.innerHTML += `<option value=${groups[i].id}>${groups[i].name}</option>`;
    }

    interactable();
}

groupsSelector.onchange = function(){
    RemoveAlert();
}

submitBTN.onclick = async function(){

    RemoveAlert();

    if(!CourseValidator(coursesSelector)) return;

    if(!GroupValidator(groupsSelector)) return;

    if(!EmailValidator(email.value)) return;

    interactable(false);

    const job = document.querySelector('input[name="job"]:checked').value;

    const res = await EnrolUser(email.value, coursesSelector.value, groupsSelector.value, job);

    coursesSelector.value = "";
    groupsSelector.innerHTML = `
    <option value="" selected disabled hidden>Choose Group</option>
    <option value="" disabled>--Empty--</option>
    `;
    email.value = "";

    interactable();
}

async function GetCourses(){

    const res = await JSON.parse(await Request("GET", "/api/get-courses", "application/json"));
    
    if(!res){

        Alert("There is a Error, Try Again.", true);

        return null;
    }

    if(!res.success){

        Alert(res.message, true);

        return null;
    }

    return res.data;
}

async function GetGroups(courseID){

    const res = await JSON.parse(await Request("POST", "/api/get-course-groups", "application/json", {
        courseID,
    }));

    if(!res) {

        Alert("There is a Error, Try Again.", true);

        return null;
    }

    if(!res.success){

        Alert(res.message, true);

        return null;
    }

    return res.data;
}

async function EnrolUser(email, courseID, groupID, job){

    const data = {
        email,
        courseID,
        groupID,
        job,
    }

    const res = await JSON.parse(await Request("POST", "/api/enroluser", "application/json", data));
    
    if(!res){

        Alert(res.message, true);

        return false;
    }

    if(!res.success){

        Alert(res.message, true);

        return false;
    }

    Alert(res.message);

    return true;
}

function CourseValidator(select){

    if(select.value === ""){

        Alert("Course Select Shouldn't be Empty Value.", true);

        return false;
    }

    return true;
}

function GroupValidator(select){

    if(select.value === ""){

        Alert("Group Select Shouldn't be Empty Value.", true);

        return false;
    }

    return true;
}

function EmailValidator(email){

    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if(!emailRegex.test(email)){

        Alert("Invalid E-mail, is't a Mail Format.", true);

        return false;
    }

    if(/[A-Z]/.test(email)){
        console.log("yes2");
        Alert("Invalid E-mail, E-Mail shouldn't Include Capital Letters.", true);
        return false;
    }
    
    return true;
}

function Alert(message, isError = false){

    alert.children[0].innerText = message;

    if(isError){
        alert.classList.remove("main-alert-success");
        alert.classList.add("main-alert-faild");
    }
    else{
        alert.classList.remove("main-alert-faild");
        alert.classList.add("main-alert-success")
    }

    alert.style.display = "block";
}

function RemoveAlert(){

    alert.classList.remove("main-alert-success");
    alert.classList.remove("main-alert-faild");

    alert.style.display = "none";
}

function interactable(state = true){

    canSubmit = state;

    submitBTN.disabled = !state;
}