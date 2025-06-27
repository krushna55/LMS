import { Router } from "express";
import {
  addLectureToCourseById,
  createCourse,
  deleteCourse,
  getAllCourse,
  getcourseById,
  removeLectureByLectureId,
  updateCourse,
} from "../controller/courseController.js";
import { authorizedRoles, isLoggedIn } from "../middleware/authmiddleware.js";
import upload from "../middleware/multerMiddleware.js";

const router = Router();

router
  .route("/")
  .get(getAllCourse)
  .post(
    isLoggedIn,
    authorizedRoles("ADMIN"),
    upload.single("thumbnail"),
    createCourse
  );

router
  .route("/:id")
  .get(isLoggedIn, authorizedRoles("ADMIN"), getcourseById)
  .put(
    isLoggedIn,
    authorizedRoles("ADMIN"),
    upload.single("thumbnail"),
    updateCourse
  )
  .delete(isLoggedIn, authorizedRoles("ADMIN"), deleteCourse)
  .post(
    isLoggedIn,
    authorizedRoles("ADMIN"),
    upload.single("lecture"),
    addLectureToCourseById
  );
 router.route('/:courseId/lectures/:lectureId').delete(isLoggedIn, authorizedRoles("ADMIN"), removeLectureByLectureId);

export default router;
