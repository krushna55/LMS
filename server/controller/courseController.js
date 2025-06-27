import cloudinary, { v2 } from "cloudinary";
import fs from "fs/promises";
import AppError from "../utils/error.util.js";
import Course from "../models/courseModel.js";
import { asyncHandler } from "../middleware/asynncHandler.js";

export const getAllCourse = asyncHandler(async (req, res, next) => {
  try {
    const course = await Course.find({}).select("-lectures");
    res.status(200).json({
      success: true,
      message: "All courses",
      course,
    });
  } catch (e) {
    return next(new AppError(e.message, 404));
  }
});

export const createCourse = asyncHandler(async (req, res, next) => {
  const { title, description, category, createdBy } = req.body;
  if (!title || !description || !category || !createdBy) {
    return next(new AppError("All fields are required", 400));
  }

  const course = await Course.create({
    title,
    description,
    category,
    createdBy,
    thumbnail: {
      secure_url: "dummy",
      public_id: "dummy;",
    },
  });

  if (!course) {
    return next(new AppError("Course not created! Try again later", 500));
  }

  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        floder: "lms",
      });
      // console.log(result);
      if (result) {
        course.thumbnail.public_id = result.public_id;
        course.thumbnail.secure_url = result.secure_url;
        fs.rm(`uploads/${req.file.filename}`);
      }
    } catch (e) {
      return next(
        new AppError(
          "Error while uploading thumbnail Please try again later!",
          500
        )
      );
    }

    await course.save();
    res.status(200).json({
      success: true,
      message: "Course created Successfully",
      course,
    });
  }
});

export const getcourseById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  try {
    const course = await Course.findById(id);
    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "course Found",
      course,
    });
  } catch (e) {
    return next(new AppError(e.message, 404));
  }
});

export const updateCourse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  // console.log(req.body);
  try {
    const course = await Course.findByIdAndUpdate(
      id,
      {
        $set: req.body,
      },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!course) {
      return next(new AppError("Course do not exists", 500));
    }
    // await course.save()
    res.status(200).json({
      success: true,
      message: "Successfully updated the course",
      course,
    });
  } catch (e) {
    return next(new AppError("Cannot update course ! Try again later !", 400));
  }
});

export const deleteCourse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  try {
    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return next(new AppError("Course not exixts", 404));
    }
    res.status(200).json({
      success: true,
      message: "Course deleted Successfully !",
      course,
    });
  } catch (e) {
    return next(new AppError("Error while deleting the course", 400));
  }
});

export const addLectureToCourseById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { title, description } = req.body;
  if (!title || !description) {
    return next(new AppError("Required all the fields", 400));
  }
  const course = await Course.findById(id);
  if (!course) {
    return next(new AppError("Course not exists", 500));
  }
  const leactureData = {
    title,
    description,
    lecture: {
      public_id: "dummy",
      secure_url: "dummy",
    },
  };
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
        chunk_size: 50000000,
        resource_type: "video",
      });
      console.log(result);
      if (result) {
        leactureData.lecture.public_id = result.public_id;
        leactureData.lecture.secure_url = result.secure_url;
      }
      fs.rm(`uploads/${req.file.filename}`);
    } catch (e) {
      return next(
        new AppError(`Error while uploading the file ${e.message}`, 400)
      );
    }

    course.lectures.push(leactureData);
    course.numberOfLectures = course.lectures.length;
    await course.save();

    res.status(200).json({
      success: true,
      message: "lecture uploaded successfully",
      course,
    });
  }
});

export const removeLectureByLectureId = asyncHandler(async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const lectureId = req.params.lectureId;

    const course = await Course.findById(courseId);
    if (!course) {
      return next(new AppError("Course do not found", 404));
    }

    const lectureIndex = course.lectures.findIndex(
      (lecture) => lecture.id.toString() === lectureId
    );
    if (lectureId == -1) {
      return next(new AppError("lecture not found", 404));
    }

    await cloudinary.v2.uploader.destroy(
      course.lectures[lectureIndex].lecture.public_id,
      {
        resource_type: "video",
      }
    );

    course.lectures.splice(lectureIndex, 1);
    course.numberOfLectures -= 1;

    await course.save();

    res.status(200).json({
      success:true,
      message:`Lecture number ${lectureIndex+1} deleted successfully `
    })
  } catch (e) {
    return next(new AppError(`Error while deleting the lectures from course ${e.message}`,500))
  }
});
