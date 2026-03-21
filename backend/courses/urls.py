from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet, FacultyViewSet, CourseViewSet,
    EnrollmentViewSet, GradeViewSet, AttendanceViewSet,
)

router = DefaultRouter()
router.register(r'departments',  DepartmentViewSet)
router.register(r'faculty',      FacultyViewSet)
router.register(r'courses',      CourseViewSet)
router.register(r'enrollments',  EnrollmentViewSet)
router.register(r'grades',       GradeViewSet)
router.register(r'attendance',   AttendanceViewSet)

urlpatterns = router.urls