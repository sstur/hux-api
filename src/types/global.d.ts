type ObjectOf<T> = { [key: string]: T };

// Modules which don't provide types by default
declare module 'cors' {
  let cors: any;
  export default cors;
}
