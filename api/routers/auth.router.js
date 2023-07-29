import { Router } from "express";

import {
    CreateUser,
    Admin_LogIn,
    GetCourses,
    C_GetCourseGroups,
    EnrolUser
} from "../controllers/users.controller.js";

const router = Router();

router.post("/api/register", CreateUser);

router.post("/api/admin-login", Admin_LogIn);

router.get("/api/get-courses", GetCourses);

router.post("/api/get-course-groups", C_GetCourseGroups);

router.post("/api/enroluser", EnrolUser);

export default router;