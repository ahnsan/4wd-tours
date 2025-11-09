import ResourceBookingModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const RESOURCE_BOOKING_MODULE = "resource_booking"

export default Module(RESOURCE_BOOKING_MODULE, {
  service: ResourceBookingModuleService,
})
