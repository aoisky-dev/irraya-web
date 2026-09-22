import { defineMiddlewares } from "@medusajs/medusa";
import fs from "fs";
import path from "path";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/uploads",
      method: "POST",
      bodyParser: {
        sizeLimit: 10 * 1024 * 1024,
      },
    },
    {
      matcher: "/uploads/*",
      middlewares: [
        (req, res, next) => {
          // Extract just the filename from req.originalUrl
          const urlPath = req.originalUrl.split('?')[0];
          
          // Remove any `/uploads` prefix AND any leading slashes
          const filename = urlPath.replace(/^\/uploads\//, "").replace(/^\/+/, "");
          
          // Use path.join to safely append the filename
          const filePath = path.join("/app/uploads", filename);
          
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.sendFile(filePath);
          } else {
            next();
          }
        }
      ],
    },
  ],
})
