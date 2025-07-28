import { TGenericErrorResponse } from "../interfaces/error.types";

export const handlerDuplicateError = (
  err: Error & { message: string }
): TGenericErrorResponse => {
  const matchedArray = err.message.match(/"([^"]*)"/);

  return {
    statusCode: 400,
    message: matchedArray
      ? `${matchedArray[1]} already exists!!`
      : "Duplicate entry already exists!",
  };
};
