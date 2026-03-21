from django.contrib import admin
from .models import FeeRecord

@admin.register(FeeRecord)
class FeeRecordAdmin(admin.ModelAdmin):
    list_display = ['student', 'fee_type', 'amount', 'status', 'due_date', 'paid_date']
    list_filter = ['status', 'fee_type']
    search_fields = ['student__name', 'student__student_id']