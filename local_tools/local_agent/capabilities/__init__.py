"""Contratos y registro estatico de capabilities confiables."""

from .base import Capability, CapabilityContext, CapabilityDescriptor, OperationDescriptor
from .registry import CapabilityRegistry

__all__ = [
    "Capability",
    "CapabilityContext",
    "CapabilityDescriptor",
    "CapabilityRegistry",
    "OperationDescriptor",
]
