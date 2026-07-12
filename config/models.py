from django.db import models

class TouristProgress(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nombre del Turista")
    contract_address = models.CharField(max_length=42, unique=True, verbose_name="Dirección del Contrato")
    group_size = models.IntegerField(default=1, verbose_name="Número de Personas")
    allergy = models.CharField(max_length=100, default="Ninguna", verbose_name="Alergias")
    current_stage = models.IntegerField(default=0, verbose_name="Etapa Actual (0 a 6)")
    status = models.CharField(max_length=20, default="active", verbose_name="Estado de la Experiencia")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última Actualización")

    def __str__(self):
        return f"{self.name} - {self.contract_address} (Etapa {self.current_stage}/6)"
