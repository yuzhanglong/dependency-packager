// // @ts-expect-error
// import * as cors from 'cors';
// import * as express from 'express';
// import { resolveDependency } from './packages/resolve-dependencies';
//
// export async function call(event: any, context: any, cb: any) {
//   try {
//     const response = await resolveDependency(event);
//     cb(undefined, response);
//   } catch (e) {
//     console.error('ERROR', e);
//   }
// }
//
// const PORT = process.env.PORT || 4545;
// /* tslint:disable no-var-requires */
// /* tslint:enable */
//
// const app = express();
//
// app.use(cors());
//
// app.get('/*', (req: any, res: any) => {
//   const packageParts = req.url.replace('/', '').split('@');
//   const version = packageParts.pop();
//
//   const ctx = {} as any;
//   const dep = { name: packageParts.join('@'), version };
//
//   call(dep, ctx, (err: any, result: any) => {
//     console.log(err);
//     if (result.error) {
//       res.status(422).json(result);
//     } else {
//       res.json(result);
//     }
//   });
// });
//
// app.listen(PORT, () => {
//   console.log(`Listening on ${PORT}`);
// });
