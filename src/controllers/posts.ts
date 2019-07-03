import { Express } from 'express';

import { validateID } from '../helpers/validateID';
import ensureObject from '../helpers/ensureObject';
import { prisma } from '../generated/prisma-client';
import { authUser } from '../helpers/session';
import isValidPhoto from '../helpers/isValidPhoto';
import { BAD_REQUEST, FORBIDDEN } from '../constants/response';
import isObject from '../helpers/isObject';

export default (app: Express) => {
  app.post('/posts', async (req, res) => {
    let user = await authUser(req.get('X-Auth'));
    if (!user) {
      return res.status(403).send(FORBIDDEN);
    }
    let { text, photo } = ensureObject(req.body);
    if (
      typeof text !== 'string' ||
      typeof photo !== 'string' ||
      !isValidPhoto(photo)
    ) {
      return res.status(400).send(BAD_REQUEST);
    }
    let post = await prisma.createPost({
      text,
      photo,
      owner: { connect: { id: user.id } },
      likes: {},
      comments: {},
      status: 'ACTIVE',
    });
    res.send({ success: true, post });
  });

  app.get('/posts', async (req, res) => {
    let user = await authUser(req.get('X-Auth'));
    if (!user) {
      return res.status(403).send(FORBIDDEN);
    }
    const fragment = `
    fragment PostsWithLikes on Post {
      id
      text
      photo
      owner {
        id
        name
        photo
      }
      likes {
        id
      }
      comments {
        id
      }
      location {
        latitude
        longitude
      }
      createdAt
    }`;
    let posts = await prisma
      .posts({
        // where: { owner: { id_not: user.id } },
        where: { status: 'ACTIVE' },
        orderBy: 'createdAt_DESC',
      })
      .$fragment(fragment);
    let viewerID = user.id;
    // We don't actually want the entire list of users that liked each post,
    // we just want the total like count and whether the current viewer
    // liked the post.
    // TODO: Is there a way to do these two operations in the GraphQL query?
    let postsWithLikeCount = Array.isArray(posts)
      ? posts.map((post) => {
          let { likes, comments, ...otherFields } = post;
          let likedByViewer = likes.some(
            (liker: { id: string }) => liker.id === viewerID,
          );
          let likeCount = likes.length;
          let commentCount = comments.length;
          return { ...otherFields, likedByViewer, likeCount, commentCount };
        })
      : [];
    res.send({ success: true, posts: postsWithLikeCount });
  });

  app.get('/posts/:id', async (req, res, next) => {
    let user = await authUser(req.get('X-Auth'));
    if (!user) {
      return res.status(403).send(FORBIDDEN);
    }
    let postID = validateID(req.params.id);
    if (!postID) {
      return next();
    }
    const fragment = `
    fragment PostWithLikes on Post {
      id
      text
      photo
      owner {
        id
        name
        photo
      }
      likes {
        id
        name
        photo
      }
      comments {
        id
        text
        owner {
          id
          name
          photo
        }
        createdAt
      }
      location {
        latitude
        longitude
      }
      createdAt
    }`;
    let result = await prisma.post({ id: postID }).$fragment(fragment);
    res.send({ success: true, post: result });
  });

  app.get('/posts/:id/comments', async (req, res, next) => {
    let user = await authUser(req.get('X-Auth'));
    if (!user) {
      return res.status(403).send(FORBIDDEN);
    }
    let postID = validateID(req.params.id);
    if (!postID) {
      return next();
    }
    const fragment = `
    fragment PostComments on Post {
      id
      comments {
        id
        text
        owner {
          id
          name
          photo
        }
        createdAt
      }
    }`;
    let result = await prisma.post({ id: postID }).$fragment(fragment);
    let comments = isObject(result) ? result.comments : [];
    res.send({ success: true, comments });
  });

  app.post('/posts/:id/likes', async (req, res, next) => {
    let user = await authUser(req.get('X-Auth'));
    if (!user) {
      return res.status(403).send(FORBIDDEN);
    }
    let postID = validateID(req.params.id);
    if (!postID) {
      return next();
    }
    let posts = await prisma.posts({
      where: {
        id: postID,
        likes_some: { id: user.id },
      },
    });
    let isLiked = posts.length !== 0;
    await prisma.updatePost({
      data: {
        likes: isLiked
          ? {
              disconnect: { id: user.id },
            }
          : {
              connect: { id: user.id },
            },
      },
      where: { id: postID },
    });
    res.send({ success: true, liked: !isLiked });
  });

  app.post('/posts/:id/comments', async (req, res, next) => {
    let user = await authUser(req.get('X-Auth'));
    if (!user) {
      return res.status(403).send(FORBIDDEN);
    }
    let postID = validateID(req.params.id);
    if (!postID) {
      return next();
    }
    let { text } = ensureObject(req.body);
    if (typeof text !== 'string' || !text.trim().length) {
      return res.status(400).send(BAD_REQUEST);
    }
    let results = await prisma
      .updatePost({
        data: {
          comments: {
            create: {
              text: text.trim(),
              owner: { connect: { id: user.id } },
              status: 'ACTIVE',
            },
          },
        },
        where: { id: postID },
      })
      .comments({ last: 1 });
    res.send({ success: true, comment: results[0] });
  });
};
