from django.contrib import admin
from .models import Student

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['student_id', 'name', 'email', 'status', 'enrolled_date']
    search_fields = ['student_id', 'name', 'email']
    list_filter = ['status']