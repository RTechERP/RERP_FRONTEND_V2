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
        // return future.routeConfig !== curr.routeConfig;
    }

    clear(route: string) {
        // Xóa tất cả các keys bắt đầu bằng route path (vì key bao gồm cả params và queryParams)
        const keysToDelete: string[] = [];
        for (const key of this.handlers.keys()) {
            if (key.startsWith(route)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.handlers.delete(key));
    }

    clearAll() {
        this.handlers.clear();
    }

    private getKey(route: ActivatedRouteSnapshot): string {
        // Bao gồm cả params và queryParams trong key để tránh reuse sai
        const params = JSON.stringify(route.params);
        const queryParams = JSON.stringify(route.queryParams);
        return route.routeConfig?.path + params + queryParams;
    }
}