import express from "express";

export const getDemoGreet = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res
        .status(400)
        .json({ message: "Name is required in the query string" })
        .end();
    }
    return res
      .status(200)
      .json({ message: `Hello ${name}! This is Demo Controller` })
      .end();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error })
      .end();
  }
};
