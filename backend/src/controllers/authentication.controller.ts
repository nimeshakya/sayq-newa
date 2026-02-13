import express from "express";
import { OAuth2Client } from "google-auth-library";
import { GOOGLE_CLIENT_ID, JWT_SECRET } from "../constants";

import jwt from "jsonwebtoken";

import UserModel from "../models/user.model";

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export const googleSignIn = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Credential is required!" }).end();
    }
    
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "GOOGLE_CLIENT_ID is not configured!" }).end();
    }

    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    // Get the user information from the payload
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("No payload from Google!");
    }

    const { sub, email, given_name, family_name, name, picture } = payload;

    // Check if user exists in our database
    let user = await UserModel.findOne({ googleId: sub });
    if (!user) {
      user = await UserModel.create({
        googleId: sub,
        email,
        name,
        given_name,
        family_name,
        picture,
        expertise_lvl: 0,
      });
    }

    // jwt token for client
    const appToken = jwt.sign({ sub: user.googleId }, JWT_SECRET!, {
      expiresIn: "1d",
    });

    // Send token as HTTP-only cookie
    // And return user info as json
    res
      .status(200)
      .cookie("token", appToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .json({ user, token: appToken })
      .end();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Google Authentication Failed!", error })
      .end();
  }
};

export const logout = async (req: express.Request, res: express.Response) => {
  res
    .status(200)
    .clearCookie("token", {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
    .json({ message: "Logged out successfully!" })
    .end();
};
