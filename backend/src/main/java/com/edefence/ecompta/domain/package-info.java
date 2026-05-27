@FilterDef(
    name = "tenantFilter",
    parameters = @ParamDef(name = "entrepriseId", type = UUID.class)
)
package com.edefence.ecompta.domain;

import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;
import java.util.UUID;
