<?php

namespace App\Models\Concerns;

use App\Models\Persona;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Spatie\Permission\Contracts\Permission;
use Spatie\Permission\Contracts\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Delega roles y permisos Spatie a la Persona vinculada.
 *
 * @mixin Model
 * @phpstan-require-extends Model
 * @property-read Persona|null $persona
 */
trait DelegatesRolesToPersona
{
    abstract public function persona(): BelongsTo;

    public function hasRole(string|int|array|Role|Collection $roles, ?string $guard = null): bool
    {
        if (! $this->persona) {
            return false;
        }

        return $this->persona->hasRole($roles, $guard);
    }

    public function hasAnyRole(string|int|array|Role|Collection ...$roles): bool
    {
        if (! $this->persona) {
            return false;
        }

        return $this->persona->hasAnyRole(...$roles);
    }

    protected function canViaPersona(mixed $ability, mixed $arguments = []): bool
    {
        if ($this->hasRole('superadmin')) {
            return true;
        }

        if (! $this->persona) {
            return false;
        }

        // Persona usa HasRoles (hasPermissionTo), no Authorizable::can().
        if (is_string($ability) && ! str_contains($ability, '\\')) {
            return $this->hasPermissionTo($ability);
        }

        return false;
    }

    public function getRoleNames(): Collection
    {
        return $this->persona?->getRoleNames() ?? collect();
    }

    public function getAllPermissions(): Collection
    {
        return $this->persona?->getAllPermissions() ?? collect();
    }

    public function assignRole(string|int|array|Role|Collection ...$roles): static
    {
        $this->persona?->assignRole(...$roles);

        return $this;
    }

    public function syncRoles(string|int|array|Role|Collection ...$roles): static
    {
        $this->persona?->syncRoles(...$roles);

        return $this;
    }

    public function roles(): BelongsToMany
    {
        return $this->persona?->roles() ?? $this->emptyRolesRelation();
    }

    public function givePermissionTo(string|int|array|Permission|Collection ...$permissions): static
    {
        $this->persona?->givePermissionTo(...$permissions);

        return $this;
    }

    public function hasPermissionTo(string|int|Permission $permission, ?string $guardName = null): bool
    {
        if ($this->hasRole('superadmin')) {
            return true;
        }

        return $this->persona?->hasPermissionTo($permission, $guardName) ?? false;
    }

    public function hasAnyPermission(string|int|array|Permission|Collection ...$permissions): bool
    {
        if ($this->hasRole('superadmin')) {
            return true;
        }

        if (! $this->persona) {
            return false;
        }

        return $this->persona->hasAnyPermission(...$permissions);
    }

    /**
     * Filtra usuarios por rol Spatie vinculado a su Persona (reemplaza HasRoles::scopeRole en User).
     *
     * @param  string|int|array|Role|Collection|\BackedEnum  $roles
     */
    public function scopeRole(Builder $query, $roles, ?string $guard = null, bool $without = false): Builder
    {
        if ($roles instanceof Collection) {
            $roles = $roles->all();
        }

        $roleClass = config('permission.models.role');
        $guardName = $guard ?? 'sanctum';

        $resolvedRoles = array_map(function ($role) use ($roleClass, $guardName) {
            if ($role instanceof Role) {
                return $role;
            }

            if ($role instanceof \BackedEnum) {
                $role = $role->value;
            }

            $method = is_int($role) || PermissionRegistrar::isUid($role) ? 'findById' : 'findByName';

            return $roleClass::{$method}($role, $guardName);
        }, Arr::wrap($roles));

        $key = (new ($roleClass)())->getKeyName();

        return $query->{$without ? 'whereDoesntHave' : 'whereHas'}(
            'persona.roles',
            fn (Builder $subQuery) => $subQuery->whereIn(
                config('permission.table_names.roles').".$key",
                array_column($resolvedRoles, $key),
            ),
        );
    }

    /**
     * @param  string|int|array|Role|Collection|\BackedEnum  $roles
     */
    public function scopeWithoutRole(Builder $query, $roles, ?string $guard = null): Builder
    {
        return $this->scopeRole($query, $roles, $guard, true);
    }

    /**
     * Filtra usuarios por permiso Spatie vinculado a su Persona (reemplaza HasPermissions::scopePermission en User).
     *
     * @param  string|int|array|Permission|Collection|\BackedEnum  $permissions
     */
    public function scopePermission(Builder $query, $permissions, bool $without = false): Builder
    {
        return $query->{$without ? 'whereDoesntHave' : 'whereHas'}(
            'persona',
            fn (Builder $personaQuery) => $personaQuery->permission($permissions, $without),
        );
    }

    /**
     * @param  string|int|array|Permission|Collection|\BackedEnum  $permissions
     */
    public function scopeWithoutPermission(Builder $query, $permissions): Builder
    {
        return $this->scopePermission($query, $permissions, true);
    }

    /**
     * Relación vacía cuando aún no hay Persona vinculada (evita NPE en consultas de roles).
     */
    private function emptyRolesRelation(): BelongsToMany
    {
        return $this->belongsToMany(
            config('permission.models.role'),
            config('permission.table_names.model_has_roles'),
            'model_id',
            'role_id',
        )->whereRaw('1 = 0');
    }
}
