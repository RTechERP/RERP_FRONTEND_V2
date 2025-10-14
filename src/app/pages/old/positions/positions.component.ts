import { Component, OnInit } from '@angular/core';
import { PositionContractComponent } from "./position-contract/position-contract.component";
import { PositionInternalComponent } from "./position-internal/position-internal.component";

@Component({
  selector: 'app-positions',
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.css'],
  imports: [PositionContractComponent, PositionInternalComponent]
})
export class PositionsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
