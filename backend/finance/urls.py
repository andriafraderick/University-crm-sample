from rest_framework.routers import DefaultRouter
from .views import FeeRecordViewSet

router = DefaultRouter()
router.register(r'fees', FeeRecordViewSet)

urlpatterns = router.urls