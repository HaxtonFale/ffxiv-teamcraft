import { Component, OnInit } from '@angular/core';
import { EquipmentPiece } from '../../../model/gearset/equipment-piece';
import { LazyDataService } from '../../../core/data/lazy-data.service';
import { MateriasService } from '../materias.service';
import { NzModalRef } from 'ng-zorro-antd';


interface MateriaMenuEntry {
  baseParamId: number;
  materias: number[];
}

@Component({
  selector: 'app-materias-popup',
  templateUrl: './materias-popup.component.html',
  styleUrls: ['./materias-popup.component.less']
})
export class MateriasPopupComponent implements OnInit {

  equipmentPiece: EquipmentPiece;

  job: number;

  materiaMenu: MateriaMenuEntry[] = [];

  constructor(private lazyData: LazyDataService, public materiasService: MateriasService,
              private modalRef: NzModalRef) {
  }

  getBonus(materia: number, index: number): { overcapped: boolean, value: number } {
    return this.materiasService.getMateriaBonus(this.equipmentPiece, materia, index);
  }

  getMeldingChances(materiaItemId: number, slot: number): number {
    const materia = this.materiasService.getMateria(materiaItemId);
    const overmeldSlot = slot - this.equipmentPiece.materiaSlots;
    if (overmeldSlot < 0) {
      return 100;
    }
    return this.lazyData.meldingRates[materia.tier - 1][overmeldSlot];
  }

  private getRelevantBaseParamsIds(job: number): number[] {
    switch (job) {
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
      case 13:
      case 14:
      case 15:
        return [11, 70, 71];
      case 16:
      case 17:
      case 18:
        return [10, 72, 73];
    }
    return [];
  }

  resetMaterias(index: number): void {
    for (let i = index; i < this.equipmentPiece.materias.length; i++) {
      this.equipmentPiece.materias[i] = 0;
    }
  }

  apply(): void {
    this.modalRef.close(this.equipmentPiece);
  }

  cancel(): void {
    this.modalRef.close(null);
  }

  getMaxValuesTable(): number[][] {
    return this.getRelevantBaseParamsIds(this.job)
      .map(baseParamId => {
        return [
          baseParamId,
          this.materiasService.getTotalStat(this.getStartingValue(this.equipmentPiece, baseParamId), this.equipmentPiece, baseParamId),
          this.materiasService.getItemCapForStat(this.equipmentPiece.itemId, baseParamId)
        ];
      });
  }

  private getStartingValue(equipmentPiece: EquipmentPiece, baseParamId: number): number {
    const itemStats = this.lazyData.data.itemStats[equipmentPiece.itemId];
    const matchingStat: any = Object.values(itemStats).find((stat: any) => stat.ID === baseParamId);
    if (matchingStat) {
      if (equipmentPiece.hq) {
        return matchingStat.HQ;
      } else {
        return matchingStat.NQ;
      }
    }
    return 0;
  }

  ngOnInit(): void {
    const relevantBaseParamsIds = this.getRelevantBaseParamsIds(this.job);
    this.materiaMenu = this.lazyData.data.materias
      .filter(materia => relevantBaseParamsIds.indexOf(materia.baseParamId) > -1)
      .reduce((acc, materia) => {
        let menuRow = acc.find(row => row.baseParamId === materia.baseParamId);
        if (menuRow === undefined) {
          acc.push({
            baseParamId: materia.baseParamId,
            materias: []
          });
          menuRow = acc[acc.length - 1];
        }
        menuRow.materias.push(materia.itemId);
        return acc;
      }, []);
  }

}
