<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Support\TenantContext;
use App\Traits\Paginates;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    use Paginates;

    public function index(Request $request): JsonResponse
    {
        $query = Company::query();

        if ($hotelId = TenantContext::id()) {
            $query->forHotel($hotelId);
        }

        if ($search = $request->query('search')) {
            $query->search($search);
        }

        $companies = $query->orderBy('name')->paginate($this->perPage($request, 20));

        return response()->json(['success' => true, 'data' => $companies]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:200',
            'nit'          => 'required|string|max:30|unique:companies,nit',
            'address'      => 'nullable|string',
            'phone'        => 'nullable|string|max:30',
            'email'        => 'nullable|email',
            'contact_name' => 'nullable|string|max:200',
            'notes'        => 'nullable|string',
        ]);

        $company = Company::create($data);

        return response()->json(['success' => true, 'data' => $company, 'message' => 'Empresa creada.'], 201);
    }

    public function show(Company $company): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $company]);
    }

    public function update(Request $request, Company $company): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'sometimes|string|max:200',
            'nit'          => 'sometimes|string|max:30|unique:companies,nit,' . $company->id,
            'address'      => 'nullable|string',
            'phone'        => 'nullable|string|max:30',
            'email'        => 'nullable|email',
            'contact_name' => 'nullable|string|max:200',
            'notes'        => 'nullable|string',
        ]);

        $company->update($data);

        return response()->json(['success' => true, 'data' => $company, 'message' => 'Empresa actualizada.']);
    }

    public function destroy(Company $company): JsonResponse
    {
        $company->delete();

        return response()->json(['success' => true, 'message' => 'Empresa eliminada.']);
    }
}
