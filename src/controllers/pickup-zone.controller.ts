import { Request, Response, NextFunction } from "express";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { PickupZoneService } from "../services/PickupZoneService";

function getSingleValue(value: unknown): string | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (rawValue === undefined || rawValue === null) {
    return undefined;
  }

  const valueString = String(rawValue).trim();
  return valueString === "" ? undefined : valueString;
}

export async function getPickupZones(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const zones = PickupZoneService.listPickupZones({
      campus: getSingleValue(req.query.campus),
      keyword: getSingleValue(req.query.keyword) || getSingleValue(req.query.q),
    });

    res.status(HttpStatusCodes.OK).json({
      items: zones,
      total: zones.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPickupZoneById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const zone = PickupZoneService.getPickupZoneById(req.params.id);
    res.status(HttpStatusCodes.OK).json(zone);
  } catch (error) {
    next(error);
  }
}
