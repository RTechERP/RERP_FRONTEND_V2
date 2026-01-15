import { Type } from '@angular/core';
import { Routes } from '@angular/router';
import { routes } from '../../../app.routes'

export const COMPONENT_REGISTRY: Record<string, Type<any>> =
    buildComponentRegistry(routes);

function buildComponentRegistry(routes: Routes): Record<string, Type<any>> {
    const map: Record<string, Type<any>> = {};

    if (!Array.isArray(routes)) {
        console.error('Routes is not iterable:', routes);
        return map;
    }

    for (const route of routes) {
        // ✅ chỉ map route thật sự có component & path
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

        // ✅ đệ quy children (layout route)
        if (route.children?.length) {
            Object.assign(map, buildComponentRegistry(route.children));
        }
    }

    return map;
}