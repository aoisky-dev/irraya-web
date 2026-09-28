import { Module } from "@medusajs/framework/utils"
import ShiprocketService from "./service"

export const SHIPROCKET_MODULE = "shiprocket"

export default Module(SHIPROCKET_MODULE, {
  service: ShiprocketService,
})
