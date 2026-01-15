import { Type } from '@angular/core';
import { Routes } from '@angular/router';
import { routes } from '../../../app.routes'

export const COMPONENT_REGISTRY: Record<string, Type<any>> = buildComponentRegistry(routes)

function buildComponentRegistry(routes: Routes): Record<string, Type<any>> {
    const map: Record<string, Type<any>> = {};

    for (const route of routes) {
        // chỉ map route có component trực tiếp
        if (
            route.path &&
            route.component &&
            !route.path.includes(':') &&
            route.path !== '' &&
            route.path !== '**'
        ) {
            map[route.path] = route.component;
        }

        // support nested routes
        if (route.children?.length) {
            Object.assign(map, buildComponentRegistry(route.children));
        }
    }

    return map;
}
