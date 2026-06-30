import { Sequelize, UniqueConstraintError, ValidationError } from "sequelize";
import logger from "../middlewares/logger.ts";
import env from '../config.ts';
import { Errors } from "../factory/errorFactory.ts";

const DATABASE_URL = env.DATABASE_URL;

export function fromSequelizeError(err: unknown) {
  if (err instanceof UniqueConstraintError) {
    const field = err.errors[0]?.path ?? "field";
    throw new Errors.FieldAlreadyUsedError({field, value:""});
  }

  /*
  if (err instanceof ValidationError) {
    const detail = err.errors.map(e => e.message).join(", ");
    return createError(ErrorEnum.ValidationError, detail);
  }
  */

  // Not a Sequelize error we recognize — let the caller decide what to do.
  throw err;
}

const sequelize = new Sequelize(DATABASE_URL, {
  logging: msg => logger.debug(msg)
});

export default sequelize