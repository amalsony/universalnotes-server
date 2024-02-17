const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

// Models
const Note = require("../models/Note");
const User = require("../models/User");

// Middleware
const isPassportAuth = require("../middleware/passportAuth");

// Utilities
const {
  getCleanURL,
  getURLDomain,
  getURLPathname,
} = require("../utilities/url");

// General
const blockedPages = require("../utilities/blockedPages");

router.post("/add-note", upload.none(), isPassportAuth, async (req, res) => {
  const { body, url: requestURL } = req.body;

  // let urlDomain = url
  //   .replace(/(https?:\/\/)?(www.)?/i, "")
  //   .split("/")[0]
  //   .split("#")[0]
  //   .split("?")[0]
  //   .split(":")[0]
  //   .toLowerCase();

  // let urlPath = `/${
  //   url
  //     .replace(/(https?:\/\/)?(www.)?/i, "")
  //     .split("/")
  //     .slice(1)
  //     .join("/")
  //     .split("#")[0]
  //     .split("?")[0]
  // }`;

  const url = getCleanURL(requestURL);
  const urlDomain = getURLDomain(requestURL);
  const urlPath = getURLPathname(requestURL);

  try {
    const newNote = new Note({
      user: req.user?.id,
      body,
      url: {
        domain: urlDomain,
        path: urlPath,
        full_url: url,
      },
      createdAt: new Date().toISOString(),
    });

    const savedNote = await newNote.save();

    console.log("savedNote", savedNote);

    return res.status(200).json({
      message: "Note saved successfully!",
      note: savedNote,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Note status (if the domain of the url is instagram.com or twitter.com and there's no path or just "/", then return false else return true)
router.post("/note-status", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  let urlDomain = url
    .replace(/(https?:\/\/)?(www.)?/i, "")
    .split("/")[0]
    .split("#")[0]
    .split("?")[0]
    .split(":")[0]
    .toLowerCase();

  let urlPath = `/${
    url
      .replace(/(https?:\/\/)?(www.)?/i, "")
      .split("/")
      .slice(1)
      .join("/")
      .split("#")[0]
      .split("?")[0]
  }`;

  if (
    blockedPages.some(
      (page) =>
        page.domain === urlDomain &&
        (page.path === urlPath || urlPath === "/" || urlPath === "")
    )
  ) {
    return res.status(200).json({
      status: false,
      placeholderText: "To prevent abuse, notes can't be added to this page.",
    });
  }

  return res.status(200).json({ status: true });
});

router.get("/get-note", async (req, res) => {
  const requestURL = req.query.url; // Access the URL parameter

  // clearURL
  const url = getCleanURL(requestURL);

  try {
    // find the latest note with the given URL
    const note = await Note.findOne({ "url.full_url": url }).sort({
      createdAt: -1,
    });

    // if the note exists, return the note
    if (note) {
      return res.status(200).json({
        success: true,
        showPopup: req.user?.id
          ? !req.user?.hidden_notes.includes(note._id)
          : true,
        message: {
          _id: note._id,
          body: note.body,
          like_count: note.like_count,
          dislike_count: note.dislike_count,
          createdAt: note.createdAt,
          isLiked: note.likes.includes(req.user?.id),
          isDisliked: note.dislikes.includes(req.user?.id),
          isPostedBySelf: req.user?.id === note.user.toString(),
        },
      });
    } else {
      return res.status(404).json({
        success: false,
        showPopup: false,
        message: "No note found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Show note i.e. get note by id
router.get("/show-note", isPassportAuth, async (req, res) => {
  const noteId = req.query.noteId;

  try {
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    return res.status(200).json({
      success: true,
      note: {
        ...note._doc,
        likes: null,
        dislikes: null,
        user: null,
        isLiked: note.likes.includes(req.user?.id),
        isDisliked: note.dislikes.includes(req.user?.id),
        isPostedBySelf: req.user?.id === note.user.toString(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Hide note
router.post("/hide-note", isPassportAuth, async (req, res) => {
  // add note to user's hidden_notes array
  const noteId = req.body.noteId;

  try {
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { $addToSet: { hidden_notes: noteId } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Note hidden successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Like a note
router.post("/like", isPassportAuth, async (req, res) => {
  const noteId = req.body.noteId;

  try {
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Check if the user has already liked the note
    if (note.likes.includes(req.user?.id)) {
      return res.status(400).json({
        success: false,
        message: "You have already liked this note",
      });
    }

    // Check if the user has disliked the note
    if (note.dislikes.includes(req.user?.id)) {
      note.dislikes = note.dislikes.filter(
        (dislike) => dislike.toString() !== req.user?.id
      );
    }

    note.likes.push(req.user?.id);
    note.like_count = note.likes.length;
    note.dislike_count = note.dislikes.length;

    const updatedNote = await note.save();

    return res.status(200).json({
      success: true,
      message: "Note liked successfully",
      note: {
        ...updatedNote._doc,
        likes: null,
        dislikes: null,
        user: null,
        isLiked: true,
        isDisliked: false,
        isPostedBySelf: req.user?.id === note.user.toString(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Unlike a note
router.post("/unlike", isPassportAuth, async (req, res) => {
  const noteId = req.body.noteId;

  try {
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Check if the user has already liked the note
    if (!note.likes.includes(req.user?.id)) {
      return res.status(400).json({
        success: false,
        message: "You have not liked this note",
      });
    }

    note.likes = note.likes.filter((like) => like.toString() !== req.user?.id);
    note.like_count = note.likes.length;
    note.dislike_count = note.dislikes.length;

    const updatedNote = await note.save();

    return res.status(200).json({
      success: true,
      message: "Note unliked successfully",
      note: {
        ...updatedNote._doc,
        likes: null,
        dislikes: null,
        user: null,
        isLiked: false,
        isDisliked: false,
        isPostedBySelf: req.user?.id === note.user.toString(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Dislike a note
router.post("/dislike", isPassportAuth, async (req, res) => {
  const noteId = req.body.noteId;

  try {
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Check if the user has already disliked the note
    if (note.dislikes.includes(req.user?.id)) {
      return res.status(400).json({
        success: false,
        message: "You have already disliked this note",
      });
    }

    // Check if the user has liked the note
    if (note.likes.includes(req.user?.id)) {
      note.likes = note.likes.filter(
        (like) => like.toString() !== req.user?.id
      );
    }

    note.dislikes.push(req.user?.id);
    note.like_count = note.likes.length;
    note.dislike_count = note.dislikes.length;

    const updatedNote = await note.save();

    return res.status(200).json({
      success: true,
      message: "Note disliked successfully",
      note: {
        ...updatedNote._doc,
        likes: null,
        dislikes: null,
        user: null,
        isLiked: false,
        isDisliked: true,
        isPostedBySelf: req.user?.id === note.user.toString(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Undislike a note
router.post("/undislike", isPassportAuth, async (req, res) => {
  const noteId = req.body.noteId;

  try {
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Check if the user has already disliked the note
    if (!note.dislikes.includes(req.user?.id)) {
      return res.status(400).json({
        success: false,
        message: "You have not disliked this note",
      });
    }

    note.dislikes = note.dislikes.filter(
      (dislike) => dislike.toString() !== req.user?.id
    );
    note.like_count = note.likes.length;
    note.dislike_count = note.dislikes.length;

    const updatedNote = await note.save();

    return res.status(200).json({
      success: true,
      message: "Note undisliked successfully",
      note: {
        ...updatedNote._doc,
        likes: null,
        dislikes: null,
        user: null,
        isLiked: false,
        isDisliked: false,
        isPostedBySelf: req.user?.id === note.user.toString(),
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
