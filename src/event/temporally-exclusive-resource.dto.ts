export type TemporallyExclusiveResourceType = 'member' | 'physical_space'

export type GetTemporallyExclusiveResourceByPermissionGroupsDTO =
    {
        permissionGroupIds: Array<string>
    } & (
        {
            type: 'member'
            memberProperties: Array<string>
        } |
        {
            type: 'physical_space'
            memberProperties: undefined
        }
    )

export class CreateTemporallyExclusiveResourceDto {
    type: TemporallyExclusiveResourceType
    target: string
    appId: string
}