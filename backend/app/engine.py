from typing import List, Dict, Optional
from datetime import datetime, time, timedelta
from app.models import Collaborator, Shift, ScheduleRequest, ScheduleResult, ShiftAssignment

def calculate_end_time(start_time: time, duration_hours: int) -> time:
    dummy_date = datetime(2000, 1, 1, start_time.hour, start_time.minute)
    end_datetime = dummy_date + timedelta(hours=duration_hours)
    return end_datetime.time()

class SchedulingEngine:
    def __init__(self, request: ScheduleRequest):
        self.collaborators = request.collaborators
        self.shifts = request.shifts
        self._validate_asterisk_rule()

    def _validate_asterisk_rule(self):
        blocked_graduados = sum(1 for c in self.collaborators if c.role == 'graduado' and c.block_saturday_1)
        blocked_estagiarios = sum(1 for c in self.collaborators if c.role == 'estagiario' and c.block_saturday_1)
        blocked_recepcao = sum(1 for c in self.collaborators if c.role == 'recepcao' and c.block_saturday_1)
        
        if blocked_graduados > 2:
            raise ValueError("Limite de restrições ultrapassado: máximo de 2 graduados bloqueados no Sábado 1.")
        if blocked_estagiarios > 2:
            raise ValueError("Limite de restrições ultrapassado: máximo de 2 estagiários bloqueados no Sábado 1.")
        if blocked_recepcao > 2:
            raise ValueError("Limite de restrições ultrapassado: máximo de 2 recepcionistas bloqueados no Sábado 1.")
            
        graduados = [c for c in self.collaborators if c.role == 'graduado']
        estagiarios = [c for c in self.collaborators if c.role == 'estagiario']
        
        if graduados and blocked_graduados == len(graduados):
             raise ValueError("100% da equipe de graduados está bloqueada para o Sábado 1.")
        if estagiarios and blocked_estagiarios == len(estagiarios):
             raise ValueError("100% da equipe de estagiários está bloqueada para o Sábado 1.")

    def generate_schedule(self) -> ScheduleResult:
        """
        Gera a escala unificada para todos (Graduados, Estagiários, Recepção, Limpeza)
        """
        assignments = []
        unfilled = []
        
        # O Motor de Geração foca em distribuir com equilíbrio:
        shift_counts = {c.id: 0 for c in self.collaborators}
        
        for shift in self.shifts:
            # 1. Assinar Graduados
            assigned_graduados = 0
            available_graduados = [c for c in self.collaborators if c.role == 'graduado' and not (shift.name == 'Sábado 1' and c.block_saturday_1)]
            available_graduados.sort(key=lambda x: shift_counts[x.id])
            
            for c in available_graduados:
                if assigned_graduados < shift.required_graduados:
                    assignments.append(ShiftAssignment(shift_id=shift.id, collaborator_id=c.id, date=shift.name, start_time=shift.start_time, end_time=calculate_end_time(shift.start_time, 6)))
                    shift_counts[c.id] += 1
                    assigned_graduados += 1
                    
            if assigned_graduados < shift.required_graduados:
                unfilled.append({"shift_id": shift.id, "role": "graduado", "missing": shift.required_graduados - assigned_graduados})
                
            # 2. Assinar Estagiários
            assigned_estagiarios = 0
            available_estagiarios = [c for c in self.collaborators if c.role == 'estagiario' and not (shift.name == 'Sábado 1' and c.block_saturday_1)]
            available_estagiarios.sort(key=lambda x: shift_counts[x.id])
            
            for c in available_estagiarios:
                if assigned_estagiarios < shift.required_estagiarios:
                    assignments.append(ShiftAssignment(shift_id=shift.id, collaborator_id=c.id, date=shift.name, start_time=shift.start_time, end_time=calculate_end_time(shift.start_time, 5)))
                    shift_counts[c.id] += 1
                    assigned_estagiarios += 1
                    
            if assigned_estagiarios < shift.required_estagiarios:
                unfilled.append({"shift_id": shift.id, "role": "estagiario", "missing": shift.required_estagiarios - assigned_estagiarios})

            # 3. Assinar Recepção
            assigned_recepcao = 0
            available_recepcao = [c for c in self.collaborators if c.role == 'recepcao' and not (shift.name == 'Sábado 1' and c.block_saturday_1)]
            available_recepcao.sort(key=lambda x: shift_counts[x.id])
            
            for c in available_recepcao:
                if assigned_recepcao < shift.required_recepcao:
                    assignments.append(ShiftAssignment(shift_id=shift.id, collaborator_id=c.id, date=shift.name, start_time=shift.start_time, end_time=calculate_end_time(shift.start_time, 6)))
                    shift_counts[c.id] += 1
                    assigned_recepcao += 1
                    
            if assigned_recepcao < shift.required_recepcao:
                unfilled.append({"shift_id": shift.id, "role": "recepcao", "missing": shift.required_recepcao - assigned_recepcao})

            # 4. Assinar Limpeza (Serviços Gerais)
            assigned_servicos = 0
            available_servicos = [c for c in self.collaborators if c.role == 'servicos_gerais' and not (shift.name == 'Sábado 1' and c.block_saturday_1)]
            available_servicos.sort(key=lambda x: shift_counts[x.id])
            
            for c in available_servicos:
                if assigned_servicos < shift.required_servicos_gerais:
                    assignments.append(ShiftAssignment(shift_id=shift.id, collaborator_id=c.id, date=shift.name, start_time=shift.start_time, end_time=calculate_end_time(shift.start_time, 6)))
                    shift_counts[c.id] += 1
                    assigned_servicos += 1
                    
            if assigned_servicos < shift.required_servicos_gerais:
                unfilled.append({"shift_id": shift.id, "role": "servicos_gerais", "missing": shift.required_servicos_gerais - assigned_servicos})
                
        return ScheduleResult(assignments=assignments, unfilled_shifts=unfilled, shift_counts=shift_counts)
