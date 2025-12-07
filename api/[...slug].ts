import app from '../dist/app'

export default function handler(req: any, res: any) {
  return app(req, res)
}
