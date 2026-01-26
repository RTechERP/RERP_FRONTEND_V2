import { Type } from '@angular/core';
import { Routes } from '@angular/router';


export function buildComponentRegistry(routes: Routes): Record<string, Type<any>> {
    const map: Record<string, Type<any>> = {};

    if (!Array.isArray(routes)) {
        return map;
    }

    for (const route of routes) {
        if (
            route.path &&
            route.component &&
            route.path !== '' &&
            route.path !== '**' &&
            !route.redirectTo &&
            !route.path.includes(':')
        ) {
            map[route.path] = route.component;
        }

        if (route.children?.length) {
            Object.assign(map, buildComponentRegistry(route.children));
        }
    }

    return map;
}