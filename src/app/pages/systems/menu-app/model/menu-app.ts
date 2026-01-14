export class MenuApp {
    ID?: number | null = 0
    STT?: number | null = 0;
    Code?: string | null = '';
    Title?: string | null = '';
    Router?: string | null = '';
    QueryParam?: string | null = '';
    Icon?: string | null = '';
    ParentID?: number | null = 0;
    CreatedDate?: Date | null = null;
    CreatedBy?: string | null = null;
    UpdatedDate?: Date | null = null;
    UpdatedBy?: string | null = null;
    IsDeleted?: boolean | null = null;
    MenuAppUserGroupLinks?: MenuAppUserGroupLink[] = [];
    PermissionCodes?: string | null = '';

    constructor(init?: Partial<MenuApp>) {
        Object.assign(this, init);
    }
}


export class MenuAppUserGroupLink {
    ID?: number | null = 0;
    MenuAppID?: number | null = 0;
    UserGroupID?: number | null = 0;
    CreatedDate?: Date | null = null;
    CreatedBy?: string | null = null;
    UpdatedDate?: Date | null = null;
    UpdatedBy?: string | null = null;
    IsDeleted?: boolean = false;

    constructor(init?: Partial<MenuAppUserGroupLink>) {
        Object.assign(this, init);
    }
}

