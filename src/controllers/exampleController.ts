import type { Request, Response } from "express"

export class ExampleController {
  public cheers = async (req: Request, res: Response): Promise<void> => {
    const name: string = req.body?.name ?? 'Simone'
    res.status(200).send("Hello " + name)
  }
}