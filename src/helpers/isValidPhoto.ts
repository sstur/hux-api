const validPhoto = /^https:\/\/res.cloudinary.com\//;

export default function isValidPhoto(url: unknown): url is string {
  return typeof url === 'string' && validPhoto.test(url);
}
