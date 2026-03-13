import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BaseService {
  baseUrl = environment.ems_baseURL;
  constructor(
    protected http: HttpClient,
  ) {}
  protected buildTree(data: TreeNode[]) {
    const map: { [key: number]: TreeNode } = {};
    const roots: TreeNode[] = [];

    data.forEach((item) => {
      map[item.Id] = { ...item, children: [] };
    });

    data.forEach((item) => {
      if (item.ParentId && map[item.ParentId]) {
        map[item.ParentId].children!.push(map[item.Id]);
      } else {
        roots.push(map[item.Id]);
      }
    });

    return roots;
  }
}
export interface TreeNode {
  Id: number;
  ParentId?: number;
  [key: string]: any;
  children?: TreeNode[];
}
