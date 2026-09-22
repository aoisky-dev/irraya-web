const { defineConfig } = require("@medusajs/framework/utils")
const config = defineConfig({
  projectConfig: { databaseUrl: "postgres://a" },
  modules: [ { resolve: "a" } ]
})
console.log(config)
