from rest_framework import serializers
from .models import FeeRecord

class FeeRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_id   = serializers.CharField(source='student.student_id', read_only=True)

    class Meta:
        model = FeeRecord
        fields = '__all__'