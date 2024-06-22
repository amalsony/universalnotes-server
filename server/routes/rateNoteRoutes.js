const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

// Models
const Note = require("../models/Note");
const User = require("../models/User");
const Hidden = require("../models/Hidden");
const Like = require("../models/Like");
const Dislike = require("../models/Dislike");

// Middleware
const isPassportAuth = require("../middleware/passportAuth");
const isAccessCodeOptionalPassportAuth = require("../middleware/accessCodeOptionalPassportAuth");

// Utilities
const {
  getCleanURL,
  getURLDomain,
  getURLPathname,
} = require("../utilities/url");

// get-proposed-notes get all notes on the given url
router.get("/get-proposed-notes", async (req, res) => {
  const requestURL = req.query.url; // Access the URL parameter

  // clearURL
  const url = getCleanURL(requestURL);

  try {
    // find all notes arguing for added context to the given url (if isAgainstContext is a field in the note, then it should be false; however it's the field isn't on all notes and they should be included too)
    const dbNotesWithContext = await Note.find({
      "url.full_url": url,
      $or: [
        { isAgainstContext: { $exists: false } },
        { isAgainstContext: false },
      ],
    }).sort({
      createdAt: -1,
    });

    // find all notes arguing against added context to the given url
    const dbNotesAgainstContext = await Note.find({
      "url.full_url": url,
      isAgainstContext: true,
    }).sort({
      createdAt: -1,
    });

    function getNotesWithStatus(notes) {
      // notes with isLiked, isDisliked, and isPostedBySelf properties
      return Promise.all(
        notes.map(async (note) => {
          const DBLike = await Like.findOne({
            note: note._id,
            user: req.user?.id,
          });

          const DBDislike = await Dislike.findOne({
            note: note._id,
            user: req.user?.id,
          });

          const proposedBody =
            note && note.like_count + note.dislike_count < 5
              ? `*This is a proposed note*\n\n${note.body}\n\n *Rate this note to display it to all UniversalNotes members*`
              : note.body;

          return {
            ...note._doc,
            likes: null,
            dislikes: null,
            user: null,
            body: note.body,
            isLiked: DBLike ? true : false,
            isDisliked: DBDislike ? true : false,
            isPostedBySelf: req.user?.id === note.user.toString(),
          };
        })
      );
    }

    const notesWithContext = await getNotesWithStatus(dbNotesWithContext);
    const notesAgainstContext = await getNotesWithStatus(dbNotesAgainstContext);

    return res.status(200).json({
      success: true,
      data: {
        notesWithContext,
        notesAgainstContext,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
