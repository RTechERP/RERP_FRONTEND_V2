import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from "@angular/router";

export class CustomRouteReuseStrategy implements RouteReuseStrategy {
    private handlers = new Map<string, DetachedRouteHandle>();

    shouldDetach(route: ActivatedRouteSnapshot): boolean {
        return !!route.routeConfig?.path;
    }

    store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
        const key = this.getKey(route);
        this.handlers.set(key, handle);
    }


    shouldAttach(route: ActivatedRouteSnapshot): boolean {
        const key = this.getKey(route);
        return this.handlers.has(key);
    }

    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
        const key = this.getKey(route);
        return this.handlers.get(key) || null;
    }

    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        return future.routeConfig === curr.routeConfig;
    }

    private getKey(route: ActivatedRouteSnapshot): string {
        return route.routeConfig?.path + JSON.stringify(route.params);
    }
}