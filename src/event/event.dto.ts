import { IsArray, IsBoolean, IsDate, IsDateString, IsInt, IsJSON, IsObject, IsPositive, IsString, IsUUID } from "class-validator";
import { IsValidRRule } from './validator/event.validator'

export class UpdateEventDTO {
    @IsString()
    app_id?: string

    @IsString()
    source_type?: string

    @IsUUID()
    source_target?: string

    @IsObject()
    metadata?: object

    @IsDateString()
    started_at?: string

    @IsDateString()
    ended_at?: string

    @IsDateString()
    published_at?: string

    @IsDateString()
    deleted_at?: string

    @IsValidRRule()
    rrule?: string

    @IsDateString()
    until?: string

    @IsString()
    title?: string

    @IsString()
    description?: string
}

export class EventDTO extends UpdateEventDTO {
    @IsString()
    app_id: string

    @IsDateString()
    started_at?: string

    @IsDateString()
    ended_at?: string
}

export class InsertEventsDTO {
    @IsArray()
    events: Array<EventDTO>
}

export class EventResourceDTO {
    @IsUUID()
    temporally_exclusive_resource_id: string

    @IsUUID()
    event_id: string

    @IsObject()
    metadata?: object

    @IsDate()
    deleted_at?: Date

    @IsString()
    role?: string

    @IsBoolean()
    is_exclusive?: boolean

    @IsString()
    is_attending?: 'YES' | 'NO' | 'MAYBE'
}

export class InsertEventResourceDTO {
    @IsArray()
    eventResources: Array<EventResourceDTO>
}

class ResourcesDTOBaseForInvitation {

    @IsUUID()
    temporally_exclusive_resource_id: string

    @IsObject()
    metadata?: object

    @IsDate()
    deleted_at?: Date

    @IsString()
    role?: string

    @IsBoolean()
    is_exclusive?: boolean
}

export class InviteResourcesDTO {
    @IsArray()
    eventIds: Array<string>

    @IsArray()
    eventResources: Array<ResourcesDTOBaseForInvitation>
}

export class DeliverEventsDTOBase {
    @IsString()
    source_type: string

    @IsUUID()
    source_target: string

    @IsUUID()
    member_id: string

    @IsPositive()
    @IsInt()
    amount: number

    @IsString()
    app_id: string
}

export class DeliverEventsDTO extends DeliverEventsDTOBase {
    @IsBoolean()
    is_exclusive: boolean
}