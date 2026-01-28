import AttendanceRecord from "../models/AttendanceRecord.js";
import ClassSession from "../models/ClassSession.js";
import Student from "../models/Student.js";

export const studentReport = async (req, res) => {
  try {
    const student = await Student.findOne({
      collegeId: req.user.collegeId
    });

    const records = await AttendanceRecord.aggregate([
      { $match: { studentId: student._id } },
      {
        $lookup: {
          from: "classsessions",
          localField: "sessionId",
          foreignField: "_id",
          as: "session"
        }
      },
      { $unwind: "$session" },
      {
        $group: {
          _id: "$session.subject",
          totalClasses: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $eq: ["$status", "P"] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json(records);

  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch student report"
    });
  }
};

export const sessionReport = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const records = await AttendanceRecord.find({ sessionId })
      .populate("studentId", "collegeId name");

    res.json(records);

  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch session report"
    });
  }
};

export const hodReport = async (req, res) => {
  try {
    const { branch, semester } = req.query;

    const report = await AttendanceRecord.aggregate([
      {
        $lookup: {
          from: "classsessions",
          localField: "sessionId",
          foreignField: "_id",
          as: "session"
        }
      },
      { $unwind: "$session" },
      {
        $match: {
          "session.branch": branch,
          "session.semester": Number(semester)
        }
      },
      {
        $group: {
          _id: "$studentId",
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $eq: ["$status", "P"] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json(report);

  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch HOD report"
    });
  }
};

