import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from config.models import TouristProgress

def home_view(request):
    return render(request, 'index.html')

def admin_panel_view(request):
    return render(request, 'admin_panel.html')

def usuario_view(request):
    return render(request, 'usuario.html')

@csrf_exempt
def create_tourist_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name', 'Turista Anónimo')
            contract_address = data.get('contract_address')
            group_size = int(data.get('group_size', 1))
            allergy = data.get('allergy', 'Ninguna')
            
            if not contract_address:
                return JsonResponse({'success': False, 'error': 'Falta la dirección del contrato'}, status=400)
            
            # Guardamos la dirección siempre en minúsculas para comparaciones consistentes
            progress, created = TouristProgress.objects.update_or_create(
                contract_address=contract_address.lower(),
                defaults={
                    'name': name,
                    'group_size': group_size,
                    'allergy': allergy,
                    'current_stage': 0,
                    'status': 'active'
                }
            )
            return JsonResponse({'success': True, 'created': created, 'id': progress.id})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)

@csrf_exempt
def update_tourist_progress_api(request):
    if request.method == 'POST':
        if request.headers.get('X-Admin-Token') != 'hackathon-demo-2026':
            return JsonResponse({'success': False, 'error': 'No autorizado'}, status=403)
        try:
            data = json.loads(request.body)
            contract_address = data.get('contract_address')
            stage_id = data.get('stage_id')
            status = data.get('status')
            
            if not contract_address:
                return JsonResponse({'success': False, 'error': 'Falta la dirección del contrato'}, status=400)
            
            try:
                progress = TouristProgress.objects.get(contract_address=contract_address.lower())
            except TouristProgress.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Contrato no registrado en la base de datos'}, status=404)
            
            if stage_id is not None:
                progress.current_stage = int(stage_id)
                if progress.current_stage == 6:
                    progress.status = 'completed'
            
            if status is not None:
                progress.status = status
                
            progress.save()
            return JsonResponse({
                'success': True, 
                'name': progress.name,
                'current_stage': progress.current_stage,
                'status': progress.status
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)

def list_tourists_api(request):
    if request.headers.get('X-Admin-Token') != 'hackathon-demo-2026':
        return JsonResponse({'success': False, 'error': 'No autorizado'}, status=403)
    tourists = TouristProgress.objects.all().order_by('-updated_at')
    data = []
    for t in tourists:
        data.append({
            'id': t.id,
            'name': t.name,
            'contract_address': t.contract_address,
            'group_size': t.group_size,
            'allergy': t.allergy,
            'current_stage': t.current_stage,
            'status': t.status,
            'updated_at': t.updated_at.isoformat()
        })
    return JsonResponse({'success': True, 'tourists': data})
