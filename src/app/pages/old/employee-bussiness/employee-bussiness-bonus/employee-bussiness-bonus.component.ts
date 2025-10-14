import { Component, OnInit } from '@angular/core';
import { EmployeeBussinessVehicleComponent } from "../employee-bussiness-vehicle/employee-bussiness-vehicle.component";
import { EmployeeBussinessTypeComponent } from "../employee-bussiness-type/employee-bussiness-type.component";

@Component({
  selector: 'app-employee-bussiness-bonus',
  templateUrl: './employee-bussiness-bonus.component.html',
  styleUrls: ['./employee-bussiness-bonus.component.css'],
  imports: [EmployeeBussinessVehicleComponent, EmployeeBussinessTypeComponent]
})
export class EmployeeBussinessBonusComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
